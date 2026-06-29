' Script name: PreviewNext
'
' Automatically puts the next input into preview after each transition.
' If the active input is the last one, vMix will ignore the out-of-range preview request gracefully.

Dim SCRIPT_NAME As String = "preview-next"
Dim SCRIPT_VERSION As String = "1.0.0"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " PreviewNext " & SCRIPT_VERSION)

' --- VERSION CHECK ---
Try
    Dim verRequest As System.Net.HttpWebRequest = System.Net.HttpWebRequest.Create(VERSIONS_URL)
    verRequest.Timeout = 5000
    Dim verResponse As System.Net.HttpWebResponse = verRequest.GetResponse()
    Dim verReader As New System.IO.StreamReader(verResponse.GetResponseStream())
    Dim verJson As String = verReader.ReadToEnd()
    verReader.Close()
    verResponse.Close()

    Dim key As String = """" & SCRIPT_NAME & """:"
    Dim keyIndex As Integer = verJson.IndexOf(key)
    If keyIndex >= 0 Then
        Dim valueStart As Integer = verJson.IndexOf("""", keyIndex + key.Length) + 1
        Dim valueEnd As Integer = verJson.IndexOf("""", valueStart)
        If valueStart > 0 And valueEnd > valueStart Then
            Dim latestVersion As String = verJson.Substring(valueStart, valueEnd - valueStart)
            If latestVersion <> SCRIPT_VERSION Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " PreviewNext | Update available: v" & latestVersion & " (running v" & SCRIPT_VERSION & ") - https://github.com/live-miracles/vmix-master")
            End If
        End If
    End If
Catch ex As Exception
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " PreviewNext | Could not check for updates: " & ex.Message)
End Try

' ===== Configurations =====
Dim LOOP_TIME As Integer = 300  ' Poll interval in ms
Dim DELAY_TIME As Integer = 1000  ' How long to wait after a transition before updating preview

Dim lastActive As String = ""
Dim xml As New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        xml.LoadXml(API.XML())

        Dim active As String = xml.SelectSingleNode("//active").InnerText

        If lastActive <> active Then
            Sleep(DELAY_TIME)
            lastActive = active
            Dim nextInput As String = CStr(CInt(lastActive) + 1)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " PreviewNext | Updating preview: " & nextInput)
            API.Function("PreviewInput", Input:=nextInput)
            Continue Do
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " PreviewNext | Unexpected error: " & ex.Message)
    End Try
Loop
